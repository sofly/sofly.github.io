import cv2
import numpy as np
import flask
import base64
import io
import re

import mediapipe as mp
mp_face_mesh = mp.solutions.face_mesh

# deployment
# gcloud functions deploy illumination --entry-point gcf_entrypoint --runtime python38 --trigger-http --memory=2048MB

# testing
# curl https://us-central1-compass-sandbox.cloudfunctions.net/illumination -H "Content-Type: application/json" -d @../my_test.json

# Requirements: 512Mb

# Threshold values should be:
# faceShadow < 0.1
# faceSaturation < 0.05
# backgroundSaturation < 0.1


silhouette = [
    10,  338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58,  132, 93,  234, 127, 162, 21,  54,  103, 67,  109
]

rightEyeUpper0 = [246, 161, 160, 159, 158, 157, 173]
rightEyeLower0 = [33, 7, 163, 144, 145, 153, 154, 155, 133]
rightEyeUpper1 = [247, 30, 29, 27, 28, 56, 190]
rightEyeLower1 = [130, 25, 110, 24, 23, 22, 26, 112, 243]
rightEyeUpper2 = [113, 225, 224, 223, 222, 221, 189]
rightEyeLower2 = [226, 31, 228, 229, 230, 231, 232, 233, 244]
rightEyeLower3 = [143, 111, 117, 118, 119, 120, 121, 128, 245]

rightEyebrowUpper = [156, 70, 63, 105, 66, 107, 55, 193]
rightEyebrowLower = [35, 124, 46, 53, 52, 65]

leftEyeUpper0 = [466, 388, 387, 386, 385, 384, 398]
leftEyeLower0 = [263, 249, 390, 373, 374, 380, 381, 382, 362]
leftEyeUpper1 = [467, 260, 259, 257, 258, 286, 414]
leftEyeLower1 = [359, 255, 339, 254, 253, 252, 256, 341, 463]
leftEyeUpper2 = [342, 445, 444, 443, 442, 441, 413]
leftEyeLower2 = [446, 261, 448, 449, 450, 451, 452, 453, 464]
leftEyeLower3 = [372, 340, 346, 347, 348, 349, 350, 357, 465]

leftEyebrowUpper = [383, 300, 293, 334, 296, 336, 285, 417]
leftEyebrowLower = [265, 353, 276, 283, 282, 295]

leftEyeHole = leftEyebrowUpper + leftEyeLower3
rightEyeHole = rightEyebrowUpper + rightEyeLower3

lipsUpperOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
lipsLowerOuter = [146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
lipsUpperInner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]
lipsLowerInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308]

lipHole = lipsUpperOuter + lipsLowerOuter

SATURATION_THRESHOLD = 225 / 255
SATURATION_RED_CHANNEL_THRESHOLD = 250 / 255


def luminance(img):
    # assumes an RGB image
    r = img[:, :, 0] * 0.299
    g = img[:, :, 1] * 0.587
    b = img[:, :, 2] * 0.114
    lum = r + g + b
    return lum


def gmean_max(img, mask):
    mask = mask.flatten()
    img_ = img.reshape((img.shape[0]*img.shape[1], 3))
    face_max = np.max(np.prod(img_[mask == 1, :], axis=1)/3)
    back_max = np.max(np.prod(img_[mask == 0, :], axis=1)/3)
    return face_max, back_max


def get_saturated_pixels(img):
    m = np.mean(img, axis=2)
    return np.where((m > SATURATION_THRESHOLD) | (img[:, :, 0] > SATURATION_RED_CHANNEL_THRESHOLD))


def convert_to_base64(arr):
    # assumes that img is a numpy array
    if np.max(arr) == 1:
        arr = arr * 255
    _, buffer = cv2.imencode(".png", arr)
    io_buf = io.BytesIO(buffer)
    return base64.b64encode(io_buf.read()).decode("utf-8")


def get_face_mask_and_landmarks(img):
    with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5) as face_mesh:
        results = face_mesh.process(img)
        if results.multi_face_landmarks is None:
            return None
        tmp = np.zeros(img.shape)
        contours = []
        lefteye = []
        righteye = []
        lips = []
        landmarks = results.multi_face_landmarks[0]

        for s in silhouette:
            l = landmarks.landmark[s]
            y = int(l.y * img.shape[0])
            x = int(l.x * img.shape[1])
            contours.append([x, y])
        for e in leftEyeHole:
            l = landmarks.landmark[e]
            y = int(l.y * img.shape[0])
            x = int(l.x * img.shape[1])
            lefteye.append([x, y])
        for e in rightEyeHole:
            l = landmarks.landmark[e]
            y = int(l.y * img.shape[0])
            x = int(l.x * img.shape[1])
            righteye.append([x, y])
        for i in lipHole:
            l = landmarks.landmark[i]
            y = int(l.y * img.shape[0])
            x = int(l.x * img.shape[1])
            lips.append([x, y])

        contours = np.array(contours).astype(np.int32)
        lefteye = np.array(lefteye).astype(np.int32)
        righteye = np.array(righteye).astype(np.int32)
        lips = np.array(lips).astype(np.int32)
        tmp = cv2.fillConvexPoly(tmp, contours, color=(255, 255, 255))
        tmp = cv2.fillConvexPoly(tmp, lefteye, color=(0, 0, 0))
        tmp = cv2.fillConvexPoly(tmp, righteye, color=(0, 0, 0))
        tmp = cv2.fillConvexPoly(tmp, lips, color=(0, 0, 0))
        return [tmp[:, :, 0] / 255, landmarks]


def evenness_heatmap(lum, face_mask):
    # calculate a heatmap of facial illuminance evenness
    face_lum = np.mean(lum[face_mask == 1])
    face_std = np.std(lum[face_mask == 1])
    face_even = lum.copy()
    face_even[face_mask == 0] = 0
    face_even[face_mask == 1] = (lum[face_mask == 1] - face_lum) / face_std
    fraction = np.where(face_even > 0.2)[0]
    fraction = len(fraction) / np.sum(face_mask)
    # normalize
    face_even = (face_even - np.min(face_even)) / (np.max(face_even) - np.min(face_even))
    face_even = np.clip(face_even*255, 0, 255).astype(np.uint8)
    face_even = cv2.applyColorMap(face_even, cv2.COLORMAP_JET)
    face_even[face_mask == 0] = [0, 0, 0]
    return face_even, fraction


def analyze_image(img, heatmap=False):
    face_mask_and_landmarks = get_face_mask_and_landmarks(img)

    if face_mask_and_landmarks is None:
        return None

    [face_mask, landmarks] = face_mask_and_landmarks
    # convert to float for calculations
    if np.max(img) > 1:
        img = img / 255.0

    # the shadow check
    lum = luminance(img)
    avg_illum = np.sum(lum) / (img.shape[0] * img.shape[1])
    gm_face, gm_back = gmean_max(img, face_mask)
    # account for Fitzpatrick 5-6
    if avg_illum > 0.4:
        gm = gm_face
    else:
        if gm_back < 0.3:
            gm = 0.3
        else:
            gm = gm_back
    if heatmap:
        face_even, fraction = evenness_heatmap(lum, face_mask)
    else:
        face_even = None
        fraction = None

    shadow_mask = np.zeros(lum.shape)
    shadow_mask[np.where(lum < gm)] = 1

    sat_idx = get_saturated_pixels(img)
    saturation_mask = np.zeros(lum.shape)
    saturation_mask[sat_idx] = 1

    # only consider that which intersects with the face mask
    face_shadow_mask = cv2.bitwise_and(face_mask, shadow_mask)
    face_saturation_mask = cv2.bitwise_and(face_mask, saturation_mask)

    # calculate percentages
    face_shadow = np.sum(face_shadow_mask) / np.sum(face_mask)
    face_saturation = np.sum(face_saturation_mask) / np.sum(face_mask)
    background_saturation = np.sum(saturation_mask) / (img.shape[0] * img.shape[1] - np.sum(face_mask))

    a_dict = {
        "landmarks": landmarks,
        "faceShadow": face_shadow,
        "faceSaturation": face_saturation,
        "backgroundSaturation": background_saturation,
        "faceShadowMask": face_shadow_mask,
        "faceSaturationMask": face_saturation_mask,
        "faceEvenessMask": face_even,
        "evennessFraction": fraction,
        "saturationMask": saturation_mask,
    }

    return a_dict


def decode_base64(base64_str):
    regex = re.compile('^data:image/(png|jpe?g);base64,\s*')
    clean_b64 = regex.sub('', base64_str)

    return base64.b64decode(clean_b64)


def gcf_entrypoint(request):
    """
    HTTP Cloud Function for illumination image mask
    """
    if request.method == 'OPTIONS':
        # Response for CORS
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age':  '3600'
        }

        return {}, 200, headers

    if request.method != "POST":
        return flask.abort(405)

    image_base_64 = None

    if request.headers['content-type'] == 'application/json':
        request_json = request.get_json(silent=True)
        if request_json:
            image_base_64 = request_json.get("imageBase64")

    if image_base_64:
        im_bytes = decode_base64(image_base_64)
        im_arr = np.frombuffer(im_bytes, dtype=np.uint8)  # im_arr is one-dim Numpy array
        img = cv2.imdecode(im_arr, flags=cv2.IMREAD_COLOR)

        img_data = analyze_image(img)

        if img_data:
            result = {
                "version": "v2",
                "shadowFaceMaskBase64": convert_to_base64(img_data["faceShadowMask"]),
                "saturationMaskBase64": convert_to_base64(img_data["faceSaturationMask"]),
                "faceSaturation": img_data["faceSaturation"],
                "faceShadow": img_data["faceShadow"],
                "backgroundSaturation": img_data["backgroundSaturation"],
            }

            response = flask.jsonify(result)
        else:
            response = flask.jsonify({"error": "No face detected"})
            response.status_code = 422

        response.headers['Access-Control-Allow-Origin'] = "*"
        return response


def render_image(img, title, x, y):
    cv2.namedWindow(title)
    cv2.moveWindow(title, x, y)
    cv2.imshow(title, img)


def render_text(img, text):
    size = image.shape[0:2]
    cv2.putText(img, text, (10, size[0]-10), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 4)


def draw_face_mesh(img, landmarks):
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    mp_face_mesh = mp.solutions.face_mesh

    mp_drawing.draw_landmarks(
        image=img,
        landmark_list=landmarks,
        connections=mp_face_mesh.FACEMESH_TESSELATION,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing_styles
        .get_default_face_mesh_tesselation_style())
    mp_drawing.draw_landmarks(
        image=img,
        landmark_list=landmarks,
        connections=mp_face_mesh.FACEMESH_CONTOURS,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing_styles
        .get_default_face_mesh_contours_style())
    mp_drawing.draw_landmarks(
        image=img,
        landmark_list=landmarks,
        connections=mp_face_mesh.FACEMESH_IRISES,
        landmark_drawing_spec=None,
        connection_drawing_spec=mp_drawing_styles
        .get_default_face_mesh_iris_connections_style())


if __name__ == "__main__":
    import argparse
    import cv2
    import os 

    parser = argparse.ArgumentParser(description="Testing the illumination check locally")
    parser.add_argument("--image", required=False)
    args = parser.parse_args()
    if args.image:
        img = cv2.imread(args.image)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img_data = analyze_image(img, heatmap=False)
        nam = os.path.basename(args.image).split(".")[0]
        cv2.imwrite(nam + "-face-shadow.png", img_data["faceShadowMask"]*255)
        cv2.imwrite(nam + "-face-saturation.png", img_data["faceSaturationMask"]*255)
        cv2.imwrite(nam + "-back-saturation.png", img_data["saturationMask"]*255)        
    else:
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 210)

        while cap.isOpened():
            success, image = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue
            image = cv2.flip(image, 1)

            img_data = analyze_image(image, heatmap=True)
            if img_data:
                landmarks = img_data["landmarks"]
                saturation_mask = img_data["saturationMask"]
                face_shadow_mask = img_data["faceShadowMask"]
                face_saturation_mask = img_data["faceSaturationMask"]
                face_saturation = img_data["faceSaturation"]
                face_shadow = img_data["faceShadow"]
                background_saturation = img_data["backgroundSaturation"]
                even = img_data["faceEvenessMask"]

                render_text(even, "{0:.2f}".format(img_data["evennessFraction"]))
                render_image(even, "Face evenness", 730, 10)

                # current threshold values:
                # faceShadow < 0.1
                # faceSaturation < 0.05
                # backgroundSaturation < 0.1
                if face_shadow < 0.1 and face_saturation < 0.05 and background_saturation < 0.1:
                    render_text(image, "Success")
                else:
                    render_text(image, "Failure")

            render_image(image, "Original", 0, 10)

            if cv2.waitKey(5) & 0xFF == 27:
                break

        cap.release()